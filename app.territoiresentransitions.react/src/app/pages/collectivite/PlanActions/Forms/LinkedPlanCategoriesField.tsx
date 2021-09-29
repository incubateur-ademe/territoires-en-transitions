import React, {FC, useState} from 'react';
import {FieldProps} from 'formik';
import {v4 as uuid} from 'uuid';
import {useAllStorables} from 'core-logic/hooks';
import {PlanActionStorable} from 'storables/PlanActionStorable';
import {planActionStore} from 'core-logic/api/hybridStores';
import {
  CategoryNode,
  nestPlanCategories,
} from 'app/pages/collectivite/PlanActions/sorting';
import {Categorie, PlanActionTyped} from 'types/PlanActionTypedInterface';
import {Menu} from '@material-ui/core';
import NestedMenuItem from 'app/pages/collectivite/Referentiels/NestedMenuItem';
import {PlanCategorie} from 'app/pages/collectivite/PlanActions/Forms/FicheActionForm';

type LinkedPlanCategoriesFieldProps = {
  label: string;
  id?: string;
  hint?: string;
};

const categoriesToItems = (
  categories: CategoryNode[],
  onSelect: (categoryUid: string) => void
): React.ReactNode[] => {
  return categories.map((node: CategoryNode): React.ReactNode => {
    return (
      <NestedMenuItem
        key={node.categorie.uid}
        parentMenuOpen={true}
        label={
          <div
            className="truncate max-w-sm"
            onClick={() => onSelect(node.categorie.uid)}
          >
            {node.categorie.nom}
          </div>
        }
      >
        {categoriesToItems(node.children, onSelect)}
      </NestedMenuItem>
    );
  });
};

const PlanDropdown = (props: {
  plan: PlanActionStorable;
  onSelect: (categorieUid: string, planUid: string) => void;
  children: React.ReactNode;
}) => {
  const [opened, setOpened] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const plan = props.plan as PlanActionStorable & PlanActionTyped;
  const categories = nestPlanCategories(plan.categories);

  const menuId = plan.uid;

  return (
    <>
      <div
        className="truncate max-w-lg cursor-pointer"
        aria-controls={menuId}
        aria-haspopup="true"
        onClick={e => {
          setAnchorEl(e.currentTarget);
          setOpened(!opened);
        }}
      >
        {props.children}
      </div>
      <Menu
        id={menuId}
        open={opened}
        onClose={() => setOpened(false)}
        anchorEl={anchorEl}
        getContentAnchorEl={null}
        anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
        transformOrigin={{vertical: 'top', horizontal: 'left'}}
      >
        {categoriesToItems(categories, categorieUid => {
          props.onSelect(categorieUid, plan.uid);
        })}
      </Menu>
    </>
  );
};

/**
 * A material UI tags field (multi picker) for action ids.
 *
 * Could use generics.
 */
export const LinkedPlanCategoriesField: FC<
  LinkedPlanCategoriesFieldProps & FieldProps
> = ({
  field, // { name, value, onChange, onBlur }
  form: {touched, errors, setFieldValue},
  ...props
}) => {
  const plans = useAllStorables<PlanActionStorable>(
    planActionStore
  ) as PlanActionStorable[] & PlanActionTyped[];
  const htmlId = props.id ?? uuid();
  const errorMessage = errors[field.name];
  const isTouched = touched[field.name];
  const value = field.value as PlanCategorie[];

  const onSelectCategorie = (categorieUid: string, planUid: string) => {
    const newPlanCategorie = {planUid, categorieUid};
    const previouslySelectedPlanCategorie = value.find(planCategorie => {
      return planCategorie.planUid === planUid;
    });
    if (previouslySelectedPlanCategorie) {
      value.map(linkPlanActionCategory => {
        return linkPlanActionCategory.planUid === planUid
          ? newPlanCategorie
          : linkPlanActionCategory;
      });
    } else {
      value.push(newPlanCategorie);
    }
    setFieldValue(field.name, value);
  };

  return (
    <fieldset className="block">
      <h1>yo {plans.length}</h1>
      {!errorMessage && props.hint && <div className="hint">{props.hint}</div>}
      {errorMessage && isTouched && <div className="hint">{errorMessage}</div>}

      {plans.map(plan => {
        const selected = value.find(cat => cat.planUid === plan.uid);
        const categories = plan.categories as Categorie[];
        const categorie = categories.find(categorie => {
          return categorie.uid === selected?.categorieUid;
        });
        return (
          <PlanDropdown plan={plan} onSelect={onSelectCategorie} key={plan.uid}>
            <div className="flex flex-row gap-2">
              <span>{plan.nom}</span>
              {selected && (
                <span>
                  {categorie && categorie.nom}
                  <button className="fr-fi-delete-line" />
                </span>
              )}
            </div>
          </PlanDropdown>
        );
      })}
      {/* <Autocomplete
        multiple
        id={htmlId}
        options=;{allSortedIndicateurIds}
        className="bg-beige list-none"
        renderOption={renderIndicateurOption}
        getOptionLabel={id => {
          return shortenLabel(renderIndicateurOption(id));
        }}
        value={field.value}
        onChange={(e, value) => {
          setFieldValue(field.name, value);
        }}
        renderInput={params => (
          <TextField
            {...params}
            variant="outlined"
            label={props.label}
            placeholder={props.label}
          />
        )}
      /> */}
    </fieldset>
  );
};
